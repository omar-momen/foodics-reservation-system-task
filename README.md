# Restaurant Reservation System

A modern web application for managing restaurant reservations, built with Vue 3, TypeScript, and Tailwind CSS. This system allows restaurant managers to handle branch operations, table management, and reservation settings efficiently.

## Features

- Branch Management
  - Enable/disable reservation acceptance per branch
  - Configure branch-specific settings
- Table Management
  - Track table availability
  - Configure reservation acceptance per table
- Reservation Settings
  - Set reservation duration
  - Configure available time slots
  - Manage reservation acceptance rules
  - Handle time conflicts between reservations

## Project Structure

```
src/
├── assets/          # Static assets and global styles
├── components/      # Vue components
│   ├── AddBranchModal.vue    # Branch creation interface
│   ├── BranchList.vue        # Main branch management component
│   ├── BranchSettingsModal.vue # Branch configuration modal
│   ├── ConfirmationModal.vue  # Reusable confirmation dialog
│   ├── TableSelector.vue     # Table selection component
│   └── TimeSlots.vue         # Time slot management component
├── composables/     # Vue composition functions
├── services/        # API service layer
│   ├── branches.ts
│   └── index.ts
├── types/          # TypeScript type definitions
│   ├── branches.ts
│   ├── globals.ts
│   └── index.ts
├── App.vue         # Root component
└── main.ts         # Application entry point
```

## Key Implementation Details

### Component Architecture

- **BranchList**: Main component for displaying and managing branches

  - Implements a responsive grid layout
  - Handles branch filtering and sorting
  - Provides quick actions for branch management

- **BranchSettingsModal**: Complex modal for branch configuration

  - Manages section and table settings
  - Handles reservation time configuration
  - Implements real-time validation

- **AddBranchModal**: Streamlined branch creation interface
  - Form validation with TypeScript
  - Real-time feedback
  - Error handling

### State Management

- Implements computed properties for derived state
- Uses TypeScript interfaces for type safety

### API Integration

- Centralized API calls in the services layer
- Axios for HTTP requests
- Type-safe response handling

## Technical Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Setup Instructions

1. **Prerequisites**

   - Node.js (v18 or higher)
   - npm (v7 or higher)

2. **Installation**

   ```sh
   # Clone the repository
   git clone [repository-url]

   # Navigate to project directory
   cd foodics-task

   # Install dependencies
   npm install
   ```

3. **Development**

   ```sh
   # Start development server
   npm run dev

   # Type checking
   npm run type-check

   # Linting
   npm run lint
   ```

4. **Production Build**

   ```sh
   # Build for production
   npm run build

   # Preview production build
   npm run preview
   ```

## Development Guidelines

1. **TypeScript**

   - All new code must be written in TypeScript
   - Maintain type definitions in the `types` directory
   - Use interfaces for data structures

2. **Component Structure**

   - Use Composition API with `<script setup>`
   - Keep components focused and single-responsibility
   - Document complex component logic

3. **Styling**

   - Use Tailwind CSS utility classes
   - Follow mobile-first responsive design
   - Maintain consistent spacing and layout

4. **Code Quality**
   - Run ESLint before committing
   - Format code with Prettier
   - Write meaningful commit messages

## IDE Setup

- **VSCode Extensions**
  - Volar (Vue Language Features)
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request
