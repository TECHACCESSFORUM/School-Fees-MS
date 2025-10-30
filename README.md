# School Fees Management System

A fully responsive, offline-first Progressive Web App (PWA) for managing school fees, students, teachers, and billing in basic schools.

## Features

### Core Functionality
- **Offline Operation**: All data stored locally using localStorage
- **User Authentication**: Admin and Cashier roles with different permissions
- **Class Management**: Add, view, and delete classes
- **Student Management**: Add, edit, delete students and assign to classes
- **Teacher Management**: Add and manage teachers
- **Billing System**: Create bills for students with descriptions and amounts
- **Payment Processing**: Record payments that automatically update student balances
- **Balance Tracking**: Real-time calculation of student outstanding balances
- **PDF Export**: Generate summary reports and payment receipts
- **Data Backup/Restore**: Export/import all data as JSON files

### User Roles
- **Admin**: Full access to all features including data management and settings
- **Cashier**: Limited to billing, payments, and viewing reports

### PWA Features
- Installable on desktop and mobile devices
- Works offline after initial load
- Responsive design for all screen sizes

## Installation & Setup

### Option 1: Direct Download
1. Download the project files as a ZIP archive
2. Extract the ZIP file to a folder on your computer
3. Open `index.html` in any modern web browser

### Option 2: Web Server (Recommended for PWA features)
1. Place the files on a web server
2. Access via HTTPS (required for PWA installation)
3. The app will prompt for installation

## Usage

### Login Credentials
- **Admin**: username: `admin`, password: `admin123`
- **Cashier**: username: `cashier`, password: `cashier123`

### Getting Started
1. Open `index.html` in your browser
2. Log in with appropriate credentials
3. Start by adding classes, then students, teachers
4. Create bills for students
5. Record payments as they are received
6. Export reports and receipts as needed

### Navigation
Use the top navigation menu to switch between different sections:
- **Home**: Dashboard with statistics
- **Classes**: Manage school classes
- **Students**: Manage student records
- **Teachers**: Manage teacher records
- **Billing**: Create bills for students
- **Reports**: Export PDF reports and receipts
- **Settings**: Backup/restore data (Admin only)

## Technical Details

### Technologies Used
- **HTML5**: Structure and markup
- **CSS3**: Responsive styling with Flexbox and Grid
- **JavaScript (ES6+)**: Application logic and data management
- **localStorage**: Client-side data persistence
- **jsPDF + AutoTable**: PDF generation
- **Service Worker**: Offline functionality and caching
- **Web App Manifest**: PWA installation

### Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### File Structure
```
school-fees-ms/
├── index.html          # Main application interface
├── styles.css          # Responsive styling
├── app.js             # Application logic
├── manifest.json      # PWA manifest
├── sw.js              # Service worker
└── README.md          # This file
```

## Data Storage

All data is stored locally in the browser's localStorage:
- `classes`: Array of class objects
- `students`: Array of student objects
- `teachers`: Array of teacher objects
- `bills`: Array of billing records
- `payments`: Array of payment records

### Backup & Restore
- Export all data as a JSON file from Settings (Admin only)
- Import JSON files to restore data
- Useful for migrating data between devices or browsers

## Security Notes

- This is a client-side only application
- Data is stored unencrypted in localStorage
- No server-side validation or security
- Suitable only for single-user, offline use
- For production use, consider server-side implementation

## Development

To modify the application:
1. Edit `index.html` for UI changes
2. Modify `styles.css` for styling updates
3. Update `app.js` for functionality changes
4. Test thoroughly before deployment

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please check the code comments or create an issue in the repository.