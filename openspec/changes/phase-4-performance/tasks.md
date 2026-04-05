## 1. Profiling & Measurement

- [ ] 1.1 Set up Chrome DevTools performance profiling
- [ ] 1.2 Set up Rust heap profiling (heaptrack)
- [ ] 1.3 Create benchmark dataset (1K, 5K, 10K headlines)
- [ ] 1.4 Establish baseline measurements for all targets

## 2. Table Performance Optimization

- [ ] 2.1 Profile virtual scrolling with 1K+ rows
- [ ] 2.2 Optimize row renderer
- [ ] 2.3 Implement cell content memoization
- [ ] 2.4 Verify <16ms jank target

## 3. Filtering Performance Optimization

- [ ] 3.1 Profile filter query execution
- [ ] 3.2 Add query result caching (LRU)
- [ ] 3.3 Optimize text search algorithm
- [ ] 3.4 Verify <100ms filter target

## 4. Initial Load Optimization

- [ ] 4.1 Profile startup sequence
- [ ] 4.2 Implement parallel file parsing
- [ ] 4.3 Add lazy loading for detail view content
- [ ] 4.4 Implement memory-mapped file reading
- [ ] 4.5 Verify <3 second load target

## 5. Memory Optimization

- [ ] 5.1 Profile memory usage over 8-hour session
- [ ] 5.2 Identify and fix memory leaks
- [ ] 5.3 Implement proper cleanup for subscriptions
- [ ] 5.4 Add memory usage telemetry

## 6. Battery Efficiency

- [ ] 6.1 Audit for continuous polling
- [ ] 6.2 Batch file change processing
- [ ] 6.3 Minimize unnecessary re-renders
- [ ] 6.4 Verify no polling during idle

## 7. Stress Testing

- [ ] 7.1 Create automated stress test suite
- [ ] 7.2 Run 8-hour stability test
- [ ] 7.3 Test with maximum realistic dataset
- [ ] 7.4 Document performance results
