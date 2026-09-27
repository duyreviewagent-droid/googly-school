import Cocoa
import WebKit

// Googly School for Mac. The whole game ships inside the app (Resources/web) and is served to the web view
// through the gschool:// scheme, so it works with no internet at all.
let webRoot = Bundle.main.resourceURL!.appendingPathComponent("web")

/// Serves gschool://app/... from the bundled game files (and /three/... from the bundled three.js).
final class GameFiles: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path.isEmpty || url.path == "/" ? "/index.html" : url.path
        path = path.replacingOccurrences(of: "..", with: "")
        let file = path.hasPrefix("/three/") ? webRoot.appendingPathComponent(path) : webRoot.appendingPathComponent("public" + path)
        guard let data = try? Data(contentsOf: file) else {
            task.didReceive(HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: nil)!)
            task.didReceive(Data()); task.didFinish(); return
        }
        let ext = file.pathExtension.lowercased()
        let mime = ["html": "text/html", "js": "text/javascript", "css": "text/css", "png": "image/png", "json": "application/json", "svg": "image/svg+xml"][ext] ?? "application/octet-stream"
        task.didReceive(HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": mime, "Content-Length": "\(data.count)", "Cache-Control": "no-cache"])!)
        task.didReceive(data)
        task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

final class GameWebView: WKWebView {
    var captured = false
    override var acceptsFirstResponder: Bool { true }
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var web: GameWebView!
    let files = GameFiles()
    var monitor: Any?

    func applicationDidFinishLaunching(_ n: Notification) {
        buildMenu()
        let frame = NSRect(x: 0, y: 0, width: 1400, height: 880)
        window = NSWindow(contentRect: frame, styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        window.title = "Googly School"
        window.titlebarAppearsTransparent = true
        window.minSize = NSSize(width: 900, height: 600)
        window.collectionBehavior = [.fullScreenPrimary]
        window.backgroundColor = NSColor(srgbRed: 0.04, green: 0.05, blue: 0.09, alpha: 1)
        window.center()

        let cfg = WKWebViewConfiguration()
        cfg.websiteDataStore = .default()                 // keeps your name, look and saved high school between launches
        cfg.mediaTypesRequiringUserActionForPlayback = []
        cfg.preferences.isElementFullscreenEnabled = true
        cfg.setURLSchemeHandler(files, forURLScheme: "gschool")
        cfg.userContentController.add(self, name: "gp")
        web = GameWebView(frame: frame, configuration: cfg)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.setValue(false, forKey: "drawsBackground")
        web.autoresizingMask = [.width, .height]
        if #available(macOS 13.3, *) { web.isInspectable = true }
        window.contentView = web
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        NotificationCenter.default.addObserver(forName: NSWindow.didResignKeyNotification, object: window, queue: .main) { [weak self] _ in self?.release(tellPage: true) }
        load(query: launchQuery())
        if !CommandLine.arguments.contains("--windowed") { window.toggleFullScreen(nil) }
        if let i = CommandLine.arguments.firstIndex(of: "--shot"), i + 1 < CommandLine.arguments.count {
            // --shot PATH [--delay S]: save a picture of the window, then quit (for testing)
            let path = CommandLine.arguments[i + 1]
            var delay = 8.0
            if let d = CommandLine.arguments.firstIndex(of: "--delay"), d + 1 < CommandLine.arguments.count { delay = Double(CommandLine.arguments[d + 1]) ?? 8 }
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                self?.web.takeSnapshot(with: nil) { img, _ in
                    if let img = img, let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff), let png = rep.representation(using: .png, properties: [:]) { try? png.write(to: URL(fileURLWithPath: path)) }
                    NSApp.terminate(nil)
                }
            }
        }
    }
    /// --query "y=2&d=5&p=7" passes test flags to the page
    func launchQuery() -> String { if let i = CommandLine.arguments.firstIndex(of: "--query"), i + 1 < CommandLine.arguments.count { return CommandLine.arguments[i + 1] }; return "" }
    func load(query: String) { web.load(URLRequest(url: URL(string: "gschool://app/index.html" + (query.isEmpty ? "" : "?" + query))!)) }
    @objc func reload() { load(query: "") }

    // ---------------------------------------------------------------- mouse capture for looking around
    func userContentController(_ c: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let s = message.body as? String else { return }
        if s == "lock" { capture() } else if s == "unlock" { release(tellPage: false) }
    }
    func capture() {
        guard !web.captured else { return }
        web.captured = true
        window.makeFirstResponder(web)
        if let screen = window.screen {
            let f = window.frame, mid = NSPoint(x: f.midX, y: f.midY)
            CGWarpMouseCursorPosition(CGPoint(x: mid.x, y: screen.frame.maxY - mid.y))
        }
        CGAssociateMouseAndMouseCursorPosition(0)
        NSCursor.hide()
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.mouseMoved, .leftMouseDragged, .rightMouseDragged, .otherMouseDragged, .leftMouseDown, .leftMouseUp]) { [weak self] e in
            guard let self = self, self.web.captured else { return e }
            switch e.type {
            case .mouseMoved, .leftMouseDragged, .rightMouseDragged, .otherMouseDragged:
                if e.deltaX != 0 || e.deltaY != 0 { self.web.evaluateJavaScript("window.__look&&__look(\(e.deltaX),\(e.deltaY))") }
                return e
            case .leftMouseDown, .leftMouseUp: return nil
            default: return e
            }
        }
    }
    func release(tellPage: Bool) {
        guard web.captured else { return }
        web.captured = false
        if let m = monitor { NSEvent.removeMonitor(m); monitor = nil }
        CGAssociateMouseAndMouseCursorPosition(1)
        NSCursor.unhide()
        if tellPage { web.evaluateJavaScript("window.__unlocked&&__unlocked()") }
    }

    // ---------------------------------------------------------------- dialogs the page asks for
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        release(tellPage: false)
        let a = NSAlert(); a.messageText = message; a.runModal(); completionHandler()
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        release(tellPage: false)
        let a = NSAlert(); a.messageText = message; a.addButton(withTitle: "OK"); a.addButton(withTitle: "Cancel")
        completionHandler(a.runModal() == .alertFirstButtonReturn)
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ n: Notification) { release(tellPage: false) }

    private func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem(); main.addItem(appItem)
        let m = NSMenu()
        m.addItem(withTitle: "About Googly School", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        m.addItem(.separator())
        m.addItem(withTitle: "Back to Title", action: #selector(reload), keyEquivalent: "r").target = self
        m.addItem(.separator())
        m.addItem(withTitle: "Hide Googly School", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        m.addItem(withTitle: "Quit Googly School", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = m
        let editItem = NSMenuItem(); main.addItem(editItem)
        let e = NSMenu(title: "Edit")   // so ⌘C / ⌘V work in the name box
        e.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        e.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        e.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        e.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = e
        let viewItem = NSMenuItem(); main.addItem(viewItem)
        let v = NSMenu(title: "View")
        v.addItem(NSMenuItem(title: "Toggle Full Screen", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f"))
        viewItem.submenu = v
        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
