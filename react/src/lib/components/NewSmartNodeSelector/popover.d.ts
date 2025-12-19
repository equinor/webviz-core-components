import "react";

declare module "react" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface HTMLAttributes<T> {
        popover?: "auto" | "manual" | "";
    }

    interface RefObject<T> {
        readonly current:
            | (T & {
                  showPopover?: () => void;
                  hidePopover?: () => void;
                  togglePopover?: (force?: boolean) => void;
              })
            | null;
    }
}
