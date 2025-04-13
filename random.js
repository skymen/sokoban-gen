/**
 * Simple random number generator with seed support
 */
class Random {
  constructor(seed) {
    this.seed = seed ? this.hashString(seed) : Math.random() * 2147483647;
  }

  /**
   * Generate a hash from a string
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get next random value between 0 and 1
   */
  next() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Pick a random weighted value
   */
  nextWeighted(options) {
    const totalWeight = options.reduce(
      (sum, option) => sum + option.weight,
      0
    );
    let value = this.next() * totalWeight;

    for (const option of options) {
      value -= option.weight;
      if (value <= 0) {
        return option.value;
      }
    }

    return options[options.length - 1].value;
  }

  /**
   * Pick a weighted random item from arrays of items and weights
   */
  nextWeightedFromArrays(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let value = this.next() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
      value -= weights[i];
      if (value <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }
}
