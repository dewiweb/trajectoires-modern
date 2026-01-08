# Trajectoires Modern

A modern web application for controlling sound spatialization trajectories via OSC.

Based on the original IRCAM Trajectoires by Xavier Favory, Jérémie Garcia, and Jean Bresson.

## Features

- **Draw trajectories** - Click and drag to draw XYZ trajectories over time
- **8 sources** - Support for up to 8 independent sound sources
- **Real-time streaming** - Send positions via OSC as you draw
- **Playback** - Play back trajectories with loop mode
- **Multi-play** - Play multiple trajectories simultaneously
- **Session management** - Save and load trajectory sessions
- **Flexible OSC** - Configure output IP/port for any OSC-compatible spatializer

## Compatible Spatializers

- **Holophonix** (default port 4003)
- **SPAT Revolution**
- **IEM Plug-ins**
- **Any OSC-compatible software**

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Open browser at http://localhost:5173
```

## Architecture

```
┌─────────────────────┐         WebSocket          ┌─────────────────────┐
│   Browser (React)   │◄────────────────────────────│   Node.js Server    │
│   localhost:5173    │                             │   localhost:3000    │
└─────────────────────┘                             └─────────────────────┘
                                                              │
                                                              │ OSC/UDP
                                                              ▼
                                                    ┌─────────────────────┐
                                                    │    Spatializer      │
                                                    │  (e.g., Holophonix) │
                                                    └─────────────────────┘
```

## OSC Protocol

The application sends OSC messages in Spat format:

```
/spat/source/N/xyz <x> <y> <z>
```

Where:
- `N` is the source number (1-8)
- `x`, `y`, `z` are normalized coordinates (-1 to 1)

## Development

### Project Structure

```
trajectoires-modern/
├── server/                 # Node.js OSC bridge server
│   ├── index.ts           # Server entry point
│   └── osc-bridge.ts      # OSC communication
├── shared/                 # Shared types and utilities
│   ├── types.ts           # TypeScript types
│   └── trajectory.ts      # Trajectory manipulation
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state management
│   └── App.tsx            # Main app component
└── package.json
```

### Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm start` - Run production server

## Configuration

Default OSC settings:
- **Output IP**: 127.0.0.1
- **Output Port**: 4003 (Holophonix default)
- **Input Port**: 9000

These can be changed in the Settings panel.

## Controls

- **Left click + drag** - Draw a new trajectory
- **Source buttons (1-8)** - Select active source
- **Play button** - Start/pause playback
- **Loop toggle** - Enable loop mode
- **Multi-play toggle** - Play all sources simultaneously
- **Zoom +/-** - Adjust canvas zoom
- **Z slider** - Set Z-axis value for drawing

## License

MIT

## Credits

- Original concept: IRCAM UMR 9912 STMS (2014-2015)
- Original authors: Xavier Favory, Jérémie Garcia, Jean Bresson
- Modern rewrite: 2024
