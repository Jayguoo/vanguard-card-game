import { ActionResult } from '../shared/types';

type EmitAction = (callback: (result: ActionResult) => void) => void;

interface PendingAction {
  resolve: (result: ActionResult) => void;
  acknowledgedResult?: ActionResult;
}

export class GameActionCoordinator {
  private pending: PendingAction | null = null;

  dispatch(emit: EmitAction): Promise<ActionResult> {
    if (this.pending) {
      return Promise.resolve({ success: false, error: 'Action already in progress' });
    }

    return new Promise(resolve => {
      this.pending = { resolve };
      emit(result => {
        if (!this.pending) return;
        if (!result.success) {
          this.finish(result);
          return;
        }
        this.pending.acknowledgedResult = result;
      });
    });
  }

  onStateUpdate(): void {
    if (this.pending?.acknowledgedResult?.success) {
      this.finish(this.pending.acknowledgedResult);
    }
  }

  cancel(error: string): void {
    if (this.pending) {
      this.finish({ success: false, error });
    }
  }

  private finish(result: ActionResult): void {
    const pending = this.pending;
    this.pending = null;
    pending?.resolve(result);
  }
}
