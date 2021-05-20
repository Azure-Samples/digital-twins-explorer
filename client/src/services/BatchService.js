// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const MAX_CONCURRENT_QUERIES = 6;

export class BatchService {

  constructor(config) {
    this.maxConcurrentQueries = config.maxConcurrentQueries || MAX_CONCURRENT_QUERIES;
    this.refreshSize = config.refreshSize || Math.round(config.items.length / 3);
    this._refresh = config.refresh;
    this._update = config.update;
    this._action = config.action;
    this._items = config.items;
  }

  async run() {
    const check = results => {
      const match = results.find(x => typeof x === Error);
      if (match) {
        throw match;
      }
    };

    const promises = [];
    this._count = 0;
    let completed = 0;
    this.update(0);

    for (let i = 0; i < this._items.length; i++) {
      const item = this._items[i];

      if (promises.length === this.maxConcurrentQueries) {
        check([ await Promise.race(promises.map(p => p.promise)) ]);
        if (++completed % this.refreshSize === 0) {
          await this.refresh();
        }
      }

      const p = {};
      p.promise = new Promise((resolve, reject) => {
        const res = () => {
          promises.splice(promises.indexOf(p), 1);

          try {
            this.update((this._count++ / this._items.length) * 100);
            resolve();
          } catch (e) {
            reject(e);
          }
        };

        try {
          this._action(item, res, reject);
        } catch (e) {
          reject(e);
        }
      }).catch(err => err);

      promises.push(p);
    }

    check(await Promise.all(promises.map(p => p.promise)));
    await this.refresh();
    this.update(100);
  }

  update(p) {
    if (this._update) {
      this._update(p);
    }
  }

  async refresh() {
    if (this._refresh) {
      await this._refresh();
    }
  }

}
