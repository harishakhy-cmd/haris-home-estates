# Creating NestJS Backend Directory Structure

Due to technical limitations with the PowerShell tool, the directories cannot be created automatically in this session. However, I've prepared two scripts that can be used to create the directory structure:

## Option 1: Using Batch File (Windows CMD)
Run the following command in Command Prompt:
```cmd
d:\LANDLORDS\create_backend_structure.bat
```

Or simply double-click the file `create_backend_structure.bat` in Windows Explorer.

## Option 2: Using Node.js
Run the following command in any terminal:
```bash
node d:\LANDLORDS\create_backend_dirs.js
```

## Option 3: Using Python
Run the following command in any terminal:
```bash
python d:\LANDLORDS\create_backend_dirs.py
# or
python3 d:\LANDLORDS\create_backend_dirs.py
```

## Directory Structure to be Created

```
d:\LANDLORDS\backend\
├── src\
│   ├── auth\
│   ├── users\
│   ├── properties\
│   ├── search\
│   ├── favorites\
│   ├── bookings\
│   ├── messaging\
│   ├── admin\
│   ├── common\
│   │   ├── decorators\
│   │   ├── guards\
│   │   ├── middleware\
│   │   └── exceptions\
│   └── database\
├── prisma\
└── test\
```

**Total Directories: 17**

## What Each Directory Is For

- **src/** - Main source code directory
  - **auth/** - Authentication module (JWT, OAuth, etc.)
  - **users/** - User management module
  - **properties/** - Property listing and management
  - **search/** - Search functionality
  - **favorites/** - Favorites/bookmarks feature
  - **bookings/** - Booking/viewing management
  - **messaging/** - Real-time messaging
  - **admin/** - Administrative features
  - **common/** - Shared utilities and middleware
    - **decorators/** - Custom NestJS decorators
    - **guards/** - Authentication/authorization guards
    - **middleware/** - Request/response middleware
    - **exceptions/** - Custom exception classes
  - **database/** - Database-related logic (migrations, seeders)
- **prisma/** - Prisma ORM configuration and schema
- **test/** - Test files and test utilities

## Next Steps

After creating the directories, you can:
1. Add NestJS modules in each feature directory
2. Create `*.module.ts` files for each module
3. Create `*.service.ts` files for business logic
4. Create `*.controller.ts` files for route handlers
5. Create `*.dto.ts` files for data transfer objects
