const MAX_CONCURRENT_QUERIES = 6;
const BATCH_REFRESH_SIZE = 3 * MAX_CONCURRENT_QUERIES;

export class BatchService {

  constructor(config) {
    this.maxConcurrentQueries = config.maxConcurrentQueries || MAX_CONCURRENT_QUERIES;
    this.refreshSize = config.refreshSize || BATCH_REFRESH_SIZE;
    this._refresh = config.refresh;
    this._update = config.update;
    this._action = config.action;
    this._items = config.items;
  }

  async run() {
    const promises = [];
    this.update(0);

    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];

      if (i % this.refreshSize === 0) {
        await this.refresh();
      }
      if (promises.length === this.maxConcurrentQueries) {
        await Promise.race(promises.map(p => p.promise));
      }

      const p = {};
      p.promise = new Promise((resolve, reject) => {
        const res = () => {
          promises.splice(promises.indexOf(p), 1);
          this.update((i / this._items.length) * 100);
          resolve();
        };

        this._action(item, res, reject);
      });

      promises.push(p);
    }

    await Promise.all(promises.map(p => p.promise));
    await this.refresh();
    this.update(100);
  }

  update(p) {
    if (this._update) {
      this._update(p);
    }
  }

  refresh() {
    if (this._refresh) {
      this._refresh();
    }
  }

}
