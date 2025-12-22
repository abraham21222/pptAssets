# 🎯 Load the Asset Library Add-in into PowerPoint

## ✅ Status: READY TO LOAD

- **Dev server:** `http://127.0.0.1:8090` (served from `ppt-addin/web`)
- **Manifest files:**
  - `manifest.xml` – ribbon button + task pane
  - `manifest-simple.xml` – minimal task-pane manifest

Keep a terminal tab open while the server is running.

---

## ⚙️ Step 0 – Start the local server

```bash
cd ~/ppt-inspector/ppt-addin
npx http-server web -p 8090 --cors
```

Leave this tab running. You can verify it in a browser at `http://127.0.0.1:8090/taskpane.html`.

---

## 📥 Step 1 – Sideload the add-in

### Option A – Command-line sideload (fastest)
```bash
cd ~/ppt-inspector/ppt-addin
npx office-addin-dev-settings sideload manifest.xml --app PowerPoint
```
This command copies the manifest into PowerPoint’s sideload folder and launches PowerPoint.

### Option B – Manual drop-in
1. Quit PowerPoint.
2. Copy the manifest into the sideload folder:
   ```bash
   mkdir -p ~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef
   cp ~/ppt-inspector/ppt-addin/manifest.xml \
      ~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef/
   ```
3. Re-open PowerPoint manually.

### Option C – Upload from the UI
1. In PowerPoint, go to **Insert → My Add-ins**.
2. Click the small dropdown labeled **MY ADD-INS** and choose **Shared Folder**; if you don’t see it, pick **Upload My Add-in → Add from file** and select `manifest.xml` from the repo.

---

## 📋 Step 2 – Open the task pane

1. In **Insert → My Add-ins**, switch to **Shared Folder** if needed.
2. Select **Asset Library** and click **Add**.
3. The ribbon button **Open Asset Library** also appears on the Home tab; click it any time to reopen the pane.

---

## 🧪 Step 3 – Test functionality

- Use the search box to filter assets (logos, charts, legal text, etc.).
- Click **Insert** to drop content on the current slide.
- Try the compliance helpers (copyright/footer buttons) at the bottom of the pane.

---

## 🚑 Troubleshooting

| Symptom | Fix |
| --- | --- |
| Nothing appears in My Add-ins | Make sure Step 1 copied the manifest into `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef/` and restart PowerPoint. |
| Add-in loads but is blank | Ensure the server from Step 0 is still running and reachable at `http://127.0.0.1:8090/taskpane.html`. |
| Port 8090 already in use | `lsof -i :8090` to find the PID, then `kill <pid>` before re-running `http-server`. |
| Need to remove sideload | `npx office-addin-dev-settings unregister manifest.xml`. |

---

## 👍 You now have

- Local dev server running on `http://127.0.0.1:8090`
- Manifest registered with PowerPoint
- Ribbon button + task pane for the Asset Library
- Quick CLI commands to sideload/unregister any time

Keep the terminal session alive while testing, and rerun the sideload command whenever you update the manifest.
