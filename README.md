# Aerostorm Racing Website

Welcome to the Aerostorm Racing Team website! This is a student-led F1 STEM racing team project featuring live camera capture, cross-device photo sharing, and a shared pit wall gallery.

## Features

### 📸 JoinTheGrid.html
- **Live Camera Capture**: Take photos directly from your device's camera
- **Real-time Upload**: Images automatically upload to the shared server
- **Image Processing**: Photos are compressed and optimized for fast transmission
- **Light Animation**: Visual feedback with an animated light bulb countdown

### 🏁 PitWall.html
- **Live Photo Gallery**: View all uploaded photos in real-time
- **Cross-Device Sync**: Photos taken on one device appear instantly on another
- **Auto-Refresh**: Gallery updates every 3 seconds
- **Responsive Grid**: Beautiful photo display with Tailwind CSS styling

### 📱 Other Pages
- **HomePage.html**: Landing page with team information
- **Engineering.html**: The engineering story behind AR Ventus 2.27 and AR Nimbus 4.51 — CAD process, aerodynamics, materials, and lessons learned
- **Sponsorship.html**: Sponsorship opportunities
- **Updates.html**: Team news feed, rendered from [`updates.json`](#updatesjson--pdf-drop-automation) — see below for how new cards get added

## updates.json & PDF-drop automation

`Updates.html` doesn't hand-code its cards — it fetches [`updates.json`](updates.json) and renders each entry as a card (date, category pill, title, summary, and a "Read Full Update" link). The first two entries (by date) show by default; the rest sit behind the "Load More" button.

> Because it fetches a JSON file, `Updates.html` needs to be served over `http://`, not opened directly as a `file://` path — browsers block that fetch otherwise. Run `python server.py` (or any static server) and open it from there.

Each entry looks like:
```json
{
  "id": "kebab-case-slug",
  "date": "2026-06-01",
  "displayDate": "JUNE 01, 2026",
  "title": "Started Work on New Car",
  "category": "Engineering",
  "summary": "2-3 sentence summary.",
  "icon": "wrench",
  "image": null,
  "pdf": null
}
```

New cards can also be generated automatically from PDFs:
1. Drop a PDF (sponsor announcement, design report, competition recap, etc.) into `updates-pdfs/`.
2. Once a day at midnight, a Windows Scheduled Task runs `scripts/run-pdf-check.ps1`, which invokes Claude Code headlessly (`claude -p`) with the instructions in `scripts/process-update-pdfs.md`.
3. Claude reads any PDF not already listed in `updates-manifest.json`, writes a title/summary/category/date, and appends a new entry to `updates.json` linking back to the PDF. The manifest is updated so the same PDF is never reprocessed.

See `updates-pdfs/README.md` and `scripts/process-update-pdfs.md` for details, and `scripts/run-pdf-check.ps1` for the scheduled task itself.

## Getting Started

### Prerequisites
- Python 3.6+ (for the backend server)
- Modern web browser with camera support
- All devices on the same network (for cross-device sharing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aerostorm-website.git
   cd aerostorm-website
   ```

2. **Start the Python backend server**
   ```bash
   python server.py
   ```
   The server will run on `http://localhost:8000`

3. **Serve the HTML files**
   - Option A: Use VS Code Live Server extension on `http://localhost:5502`
   - Option B: Open HTML files directly in your browser
   - Option C: Serve with Python's built-in server on a different port

4. **Access the website**
   - **Local**: `http://localhost:5502/HomePage.html` (or your server's port)
   - **Capture photos**: Navigate to `JoinTheGrid.html`
   - **View gallery**: Navigate to `PitWall.html`

## How It Works

### Photo Capture Flow

```
User clicks "Open Camera"
    ↓
Browser requests camera permission
    ↓
Video stream displays in preview
    ↓
User clicks "Capture"
    ↓
Image extracted from video frame
    ↓
Canvas resizes image (max 1000px)
    ↓
Base64 encoding with JPEG compression
    ↓
POST to http://localhost:8000/upload
    ↓
Backend stores image in memory
    ↓
Status message: "Photo uploaded!"
```

### Cross-Device Sync Flow

```
PitWall.html page loads
    ↓
Every 3 seconds: GET /photos-list
    ↓
Backend returns array of Base64 images
    ↓
New images added to gallery dynamically
    ↓
Duplicate detection prevents duplicates
    ↓
Photo appears on all connected devices
```

## Project Structure

```
aerostorm-website/
├── HomePage.html            # Landing page
├── JoinTheGrid.html         # Camera capture interface
├── PitWall.html             # Photo gallery
├── Engineering.html         # AR Ventus / AR Nimbus engineering story
├── Sponsorship.html         # Sponsorship info
├── Updates.html             # News feed (renders updates.json)
├── updates.json             # Update card data, fetched by Updates.html
├── updates-manifest.json    # Tracks which PDFs have been auto-processed
├── updates-pdfs/            # Drop PDFs here for auto-generated update cards
├── scripts/
│   ├── process-update-pdfs.md   # Prompt driving the headless Claude run
│   └── run-pdf-check.ps1        # Script the scheduled task actually runs
├── car-renders/              # Cropped CAD render images used on Engineering.html
├── script.js                 # Shared JavaScript utilities
├── styles.css                 # Global styles
├── server.py                  # Python HTTP backend (also serves static files)
├── requirements.txt            # Documents server.py needs no packages
├── .gitignore                  # Git ignore file
└── [images]/                    # Team logos and sponsor assets
```

## API Endpoints

### Backend Server (`http://localhost:8000`)

#### POST /upload
Uploads a photo to the shared gallery.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET /photos-list
Retrieves all uploaded photos.

**Response:**
```json
[
  "data:image/jpeg;base64,...",
  "data:image/jpeg;base64,...",
  ...
]
```

#### POST /clear-photos
Clears all photos from the gallery (use with caution!).

**Response:**
```json
{
  "success": true
}
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS 3.4.17 (CDN)
- **Icons**: Lucide Icons
- **Camera**: getUserMedia API
- **Image Processing**: Canvas API
- **Backend**: Python 3 (SimpleHTTPServer)
- **Communication**: Fetch API with JSON

## Configuration

### Environment Variables

Set the backend port via the `PORT` environment variable:

```bash
# Run on port 9000 instead of 8000
PORT=9000 python server.py
```

### API Base URL

The frontend automatically detects the backend URL. If you're serving on a different port, it will use `http://localhost:8000` by default. You can modify the `apiBase` variable in the HTML files if needed.

## Browser Compatibility

| Browser | Camera | Upload | Gallery |
|---------|--------|--------|---------|
| Chrome  | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari  | ✅ | ✅ | ✅ |
| Edge    | ✅ | ✅ | ✅ |

**Note**: Camera functionality requires HTTPS in production or localhost in development.

## Storage & Limitations

⚠️ **Important**: Photos are stored in **server memory only**. All photos are lost when the server restarts.

- Max photos: 50 (oldest automatically removed when exceeded)
- No persistent database (upgrade recommended for production)
- No authentication or access control

## Development & Deployment

### Local Development
1. Run `python server.py` for the backend
2. Use VS Code Live Server for the frontend (or any other static server)
3. Navigate to your local URL

### Production Deployment
For production deployment, consider:
- **Persistent database**: PostgreSQL, MongoDB, or similar
- **Authentication**: User accounts and login system
- **HTTPS**: Required for camera functionality
- **Hosting**: AWS, Heroku, DigitalOcean, etc.
- **CDN**: For faster image delivery
- **Admin panel**: For managing photos and users

## Troubleshooting

### Camera Not Working
- Check browser camera permissions
- Ensure you're on localhost or HTTPS
- Try a different browser

### Photos Not Appearing
- Verify backend server is running (`python server.py`)
- Check browser console for errors (F12)
- Ensure both devices are on the same network
- Verify firewall allows port 8000

### Backend Server Not Starting
- Check if port 8000 is already in use: `netstat -ano | findstr :8000`
- Kill the existing process or use a different port: `PORT=9000 python server.py`
- Ensure Python 3.6+ is installed: `python --version`

## Future Enhancements

- [ ] Persistent photo storage (database)
- [ ] User authentication and accounts
- [ ] Photo deletion by individual image
- [ ] Photo filters and effects
- [ ] Video recording in addition to photos
- [ ] Automatic backup to cloud storage
- [ ] Admin dashboard
- [ ] Photo tagging and search
- [ ] Integration with team's social media

## Team

Aerostorm Racing - A student F1 STEM racing team

## License

This project is part of the Aerostorm Racing team initiative. Please contact the team for licensing information.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by the Aerostorm Racing Team**
