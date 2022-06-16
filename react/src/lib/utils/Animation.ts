export class Animation<T extends { [key: string]: number }> {
    private duration: number;
    private states: { t: number; state: T }[];
    private transitionFunction: (t: number) => number;
    private animationFunction: (values: T, t: number) => void;
    private animationInterval: ReturnType<typeof setInterval> | null;
    private deltaT: number;
    private currentTime: number;

    constructor(
        durationMs: number,
        deltaTMs: number,
        states: { t: number; state: T }[],
        transitionFunction: (t: number) => number,
        animationFunction: (values: T, t: number) => void
    ) {
        this.duration = durationMs;
        this.deltaT = deltaTMs;
        this.states = states;
        this.transitionFunction = transitionFunction;
        this.animationInterval = null;
        this.animationFunction = animationFunction;
        this.currentTime = 0;

        if (
            !states.find((state) => state.t === 0) ||
            !states.find((state) => state.t === 1)
        ) {
            throw "You must define a start and an end state (t=0, t=1).";
        }
    }

    start(): void {
        this.currentTime = 0;
        this.animationInterval = setInterval(
            () => this.handleAnimationStep(),
            this.deltaT
        );
    }

    stop(): void {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
    }

    reset(): void {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
        this.currentTime = 0;
    }

    handleAnimationStep(): void {
        this.animationFunction(
            this.getState(this.currentTime),
            this.currentTime / this.duration
        );
        if (this.currentTime + this.deltaT <= this.duration) {
            this.currentTime += this.deltaT;
        } else {
            this.currentTime = this.duration;
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
            }
        }
    }

    private findPreviousState(t: number): number {
        let closestT = 0;
        this.states.forEach((state) => {
            if (state.t <= t && t < 1 && t - state.t < t - closestT) {
                closestT = state.t;
            }
        });
        return closestT;
    }

    private findNextState(t: number): number {
        let closestT = 1;
        this.states.forEach((state) => {
            if (state.t > t && state.t - t < closestT - t) {
                closestT = state.t;
            }
        });
        if (t === 1) {
            return 1;
        }
        return closestT;
    }

    getState(time: number): T {
        const values: { [key: string]: number } = {};
        const currentT = time / this.duration;

        const previousStateT = this.findPreviousState(currentT);
        const previousState = this.states.find(
            (state) => state.t === previousStateT
        )?.state;
        const nextStateT = this.findNextState(currentT);
        const nextState = this.states.find(
            (state) => state.t === nextStateT
        )?.state;

        if (
            previousState &&
            nextState &&
            nextStateT !== undefined &&
            previousStateT !== undefined
        ) {
            Object.keys(previousState).forEach((key) => {
                const delta = nextState[key] - previousState[key];
                values[key] =
                    previousState[key] +
                    ((this.transitionFunction(currentT) -
                        this.transitionFunction(previousStateT)) /
                        (this.transitionFunction(nextStateT) -
                            this.transitionFunction(previousStateT))) *
                        delta;
            });
        }

        return values as T;
    }

    static QuadEaseInOut(t: number): number {
        if (t <= 0.5) {
            return t * t;
        }
        return -(t - 1) * (t - 1) + 1;
    }

    static Linear(t: number): number {
        return t;
    }

    static Bezier(t: number): number {
        return t * t * (3 - 2 * t);
    }
}
