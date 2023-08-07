
# Simple Cloud Storage (SCS)

A web-based cloud storage solution, inspired by Amazon S3, that allows users to securely store, retrieve, and manage files in their personal cloud-based storage space.

## Features

- **User Authentication**: Register, log in, and manage user accounts.
- **File Operations**:
  - **Upload**: Store files in a personal cloud space.
  - **Download**: Retrieve uploaded files.
  - **List**: View all files and directories for the authenticated user.
  - **File Versioning**: Maintain different versions of a file.
  - **Search**: Search files based on filenames and metadata.
  - **Metadata Management**: Add tags and descriptions to files.
  - **Access Control**: Set file visibility to private, public, or shared with specific users.
  - **File Organization**: Create directories and organize files.

## Endpoints

- **User Management**:
  - `POST /register`: Register a new user.
  - `POST /login`: Authenticate and log in.

- **File Operations**:
  - `POST /fileupload`: Upload a new file or version.
  - `GET /filedownload/:path`: Download a file.
  - `GET /listfiles/:path?`: List files in the specified directory.
  - `POST /createdirectory/:path`: Create a new directory.
  - `POST /rollback/:path/:version`: Rollback to a specific file version.

- **Metadata**:
  - `POST /metadata/tags`: Add or update tags for a file.
  - `POST /metadata/description`: Add or update a file's description.

- **Search**:
  - `POST /search`: Search files based on filenames, tags, and descriptions.

## Project Structure

- `src/`: Contains the main application code.
  - `config/`: Configuration files.
  - `controllers/`: Logic for handling different routes.
  - `models/`: Database models and relationships.
  - `routes/`: API route definitions.
  - `middlewares/`: Middleware functions like JWT authentication.
  - `utils/`: Utility functions and constants.
- `package.json`: Project metadata and dependencies.

## Setup & Installation

1. Clone the repository.
2. Install the necessary dependencies using `npm install`.
3. Set up your database and adjust the configuration in `src/config/db.js`.
4. Start the application using `npm start`.
