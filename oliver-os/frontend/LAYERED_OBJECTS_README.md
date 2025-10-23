# AI Art Layer-Based UI System

## 🎨 Overview

This system implements a sophisticated 3-layer AI art system for interactive UI objects:

1. **Full Background** - Complete AI art without any cuts
2. **Background without Object** - The "hole" where your object was removed  
3. **Object PNG** - Isolated object you cut out

## 📁 Asset Structure

Place your AI art assets in the following structure:

```
oliver-os/frontend/public/assets/
├── backgrounds/
│   ├── main-background.png          # Main canvas background
│   └── fallback-background.png      # Fallback background
└── objects/
    ├── brain-core/
    │   ├── full-background.png      # Complete scene
    │   ├── background-without-object.png  # Scene with brain removed
    │   ├── object-isolated.png      # Just the brain object
    │   └── metadata.json            # Object properties (optional)
    ├── data-panel-left/
    │   ├── full-background.png
    │   ├── background-without-object.png
    │   └── object-isolated.png
    └── [other-objects]/
        ├── full-background.png
        ├── background-without-object.png
        └── object-isolated.png
```

## 🚀 Getting Started

### 1. Prepare Your AI Art Assets

For each interactive object, you need 3 PNG files:

- **full-background.png**: The complete AI art scene
- **background-without-object.png**: The same scene but with the object removed (creating a "hole")
- **object-isolated.png**: Just the object itself, cleanly cut out

### 2. Configure Objects

Edit `src/utils/objectRegistry.ts` to add your objects:

```typescript
const myObjects: LayeredObjectConfig[] = [
  createDefaultObjectConfig(
    'my-object-id',
    'My Object Name',
    'panel', // or 'hub', 'icon', 'screen', 'connection'
    {
      fullBackground: '/assets/objects/my-object/full-background.png',
      backgroundWithoutObject: '/assets/objects/my-object/background-without-object.png',
      objectIsolated: '/assets/objects/my-object/object-isolated.png'
    },
    { x: 100, y: 100, width: 200, height: 150 }, // position and size
    50 // z-index
  )
];
```

### 3. Set Up Background

Place your main background image at:
```
oliver-os/frontend/public/assets/backgrounds/main-background.png
```

### 4. Enable Development Mode

In the Neural Hub page, click the "DEV MODE OFF" button to enable development mode. This will show:
- Object boundaries
- Loading states
- Asset loading progress
- Interactive controls

## 🎯 Features

### Interactive Objects
- **Click Detection**: Precise hit areas for each object
- **Hover Effects**: Smooth transitions and visual feedback
- **State Management**: Track active, hovered, and disabled states
- **Accessibility**: Keyboard navigation and screen reader support

### Performance Optimizations
- **Asset Preloading**: Critical assets load first
- **Concurrent Loading**: Multiple assets load simultaneously
- **Memory Management**: Efficient caching with size limits
- **Error Handling**: Graceful fallbacks for failed assets

### Development Tools
- **Dev Mode**: Visual debugging and controls
- **Asset Validation**: Automatic validation of object configurations
- **Loading States**: Real-time asset loading progress
- **Error Reporting**: Clear error messages for failed assets

## 🎨 Styling

The system integrates seamlessly with your existing Oliver-OS design:

- **Neon Blue Theme**: Matches your futuristic aesthetic
- **Glass Morphism**: Consistent with existing components
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Design**: Adapts to different screen sizes

## 🔧 Customization

### Object Types
- `hub`: Central objects (like the brain core)
- `panel`: Data display panels
- `icon`: Small interactive icons
- `screen`: Large display screens
- `connection`: Network/connection elements

### Animation Options
- `pulse`: Pulsing glow effect
- `glow`: Brightness animation
- `scale`: Size scaling animation
- `none`: No animation

### State Classes
Customize the appearance for different states:
- `default-state`: Normal appearance
- `hover-state`: When mouse hovers
- `active-state`: When clicked
- `disabled-state`: When not interactive

## 🐛 Troubleshooting

### Assets Not Loading
1. Check file paths in object configuration
2. Ensure PNG files exist in correct directories
3. Check browser console for 404 errors
4. Verify asset URLs are accessible

### Objects Not Interactive
1. Ensure `interactive: true` in object config
2. Check z-index values (higher = on top)
3. Verify click handlers are defined
4. Check for CSS conflicts

### Performance Issues
1. Reduce asset file sizes
2. Lower `maxConcurrentLoads` setting
3. Enable asset preloading
4. Check memory usage in dev tools

## 📝 Example Usage

```typescript
// Add a new interactive object
const newObject = createDefaultObjectConfig(
  'my-new-object',
  'My New Object',
  'panel',
  {
    fullBackground: '/assets/objects/my-new-object/full-background.png',
    backgroundWithoutObject: '/assets/objects/my-new-object/background-without-object.png',
    objectIsolated: '/assets/objects/my-new-object/object-isolated.png'
  },
  { x: 500, y: 300, width: 250, height: 180 },
  60
);

// Add to registry
objectRegistryManager.addObject(newObject);
```

## 🎉 Ready to Use!

Once you've placed your AI art assets in the correct structure and configured your objects, the system will automatically:

1. Load and cache your assets
2. Create interactive clickable areas
3. Handle hover effects and animations
4. Manage object states and transitions
5. Provide development tools for debugging

The layered background will appear in the Neural Hub page, and you can toggle it on/off using the development controls.
