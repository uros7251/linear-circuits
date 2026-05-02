# Circuit Simulator

Draw and simulate linear electrical circuits in your browser — no install, no server, no waiting.

- **Blazingly fast** — circuits solve instantly as you draw, powered by an algebraic engine that only falls back to matrix math when the topology truly requires it
- **Runs right there in your browser** — pure client-side, nothing leaves your machine
- **Intuitive and easy to use UI** — drag components onto the canvas, connect them with wires, rotate with one click; results appear as animated current flow and hover tooltips

Supports resistors, capacitors, inductors, impedances, voltage sources, and current sources. Handles both DC and AC phasor analysis — sweep frequency with a slider and watch voltages and currents update in real time.

## Privacy

The hosted version uses [Microsoft Clarity](https://clarity.microsoft.com) for anonymous usage analytics (session recordings and heatmaps). No data is collected when running locally.

## Running Locally

```bash
npm install
npm run dev
```

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run solver unit tests |
| `npm run test:watch` | Run tests in watch mode |
