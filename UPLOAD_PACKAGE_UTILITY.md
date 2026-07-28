# Create Bear Tracker Upload Package

Double-click `Create-BearTrackerUpload.bat` in the Bear Tracker project folder.

The utility creates a timestamped ZIP in the folder that contains `bear-tracker` and automatically excludes:

- `.env.local` files anywhere in the project
- `.git`
- `node_modules`
- `dist`
- existing ZIP files

The original Bear Tracker project is not changed.
