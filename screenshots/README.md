# Screenshots

To complete the documentation, please add the following screenshots:

## Required Screenshots

### 1. interview-interface.png
- Main view of the dark Zoom-like interface
- Should show:
  - Left sidebar with circular persona image
  - Persona name and age
  - Scenario description
  - Bottom buttons (Guest User, Transcript, I'm Done, End Session)
  - Right side chat area with message bubbles
  - Input box at bottom with Record button

**How to capture:**
1. Start the app and log in
2. Send a few messages back and forth
3. Take a full-screen screenshot
4. Save as `interview-interface.png`

### 2. analysis-results.png
- The analysis modal after clicking "I'm Done"
- Should show:
  - Dark modal with "Interview Analysis" header
  - Overall score display (X/10)
  - Strengths section (green)
  - Areas for Improvement section (orange)
  - Close button

**How to capture:**
1. Complete an interview
2. Click "I'm Done" button
3. Click "Yes, Analyze"
4. Wait for analysis to load
5. Take screenshot of the modal
6. Save as `analysis-results.png`

### 3. signin-page.png
- Google OAuth sign-in page
- Should show:
  - "Empathy Interview Bot" branding
  - Google sign-in button
  - Guest access option (if visible)

**How to capture:**
1. Go to `/auth/signin` or sign out
2. Take screenshot of sign-in page
3. Save as `signin-page.png`

## Optional Screenshots

### 4. transcript-download.png
- Transcript download dropdown menu
- Shows TXT and PDF options

### 5. chat-with-audio.png
- Close-up of chat bubbles with Play buttons
- Shows voice controls

### 6. mobile-view.png
- Responsive mobile layout

## Image Guidelines

- **Format:** PNG (preferred) or JPG
- **Resolution:** At least 1920x1080 for desktop views
- **File size:** Keep under 2MB each
- **Content:** Remove any sensitive information before committing

## Adding to README

Once screenshots are added, verify the paths in the main README.md are correct:
```markdown
![Interview Interface](./screenshots/interview-interface.png)
![Analysis Results](./screenshots/analysis-results.png)
![Sign In](./screenshots/signin-page.png)
```
