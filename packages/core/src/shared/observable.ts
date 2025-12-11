/**
 * Hafif observer: emit microtask queue'da çalışır, UI bloklamaz.
 */
export type Observer<T> = (event: T) => void;

export class Observable<T> {
  private observers = new Set<Observer<T>>();

  subscribe(observer: Observer<T>): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  emit(event: T) {
    if (this.observers.size === 0) return;
    queueMicrotask(() => {
      this.observers.forEach((observer) => observer(event));
    });
  }
}
