import type { Example } from '@/types';

export const EXAMPLES: Example[] = [
  {
    id: 'race-condition',
    name: 'Race Condition',
    category: 'Race',
    description: 'Two threads increment a shared counter without a mutex. Updates are lost due to interleaved read-modify-write.',
    hasFix: true,
    threadCount: 2,
    resourceCount: 1,
    tags: ['race', 'mutex', 'critical section'],
    code: `#include <iostream>
#include <thread>

int counter = 0;

void increment(int n) {
    for (int i = 0; i < n; ++i) {
        // No mutex — read-modify-write is NOT atomic
        counter = counter + 1;
    }
}

int main() {
    std::thread t1(increment, 10000);
    std::thread t2(increment, 10000);
    t1.join();
    t2.join();

    std::cout << "Expected: 20000\\n";
    std::cout << "Actual:   " << counter << "\\n";
    return 0;
}`,
    fixedCode: `#include <iostream>
#include <thread>
#include <mutex>

int counter = 0;
std::mutex mtx;

void increment(int n) {
    for (int i = 0; i < n; ++i) {
        std::lock_guard<std::mutex> lock(mtx);
        // Critical section protected by mutex
        counter = counter + 1;
    }
}

int main() {
    std::thread t1(increment, 10000);
    std::thread t2(increment, 10000);
    t1.join();
    t2.join();

    std::cout << "Expected: 20000\\n";
    std::cout << "Actual:   " << counter << "\\n";
    return 0;
}`,
  },
  {
    id: 'deadlock',
    name: 'Deadlock',
    category: 'Deadlock',
    description: 'Two threads acquire two mutexes in opposite orders, creating a circular wait.',
    hasFix: true,
    threadCount: 2,
    resourceCount: 2,
    tags: ['deadlock', 'mutex', 'circular wait'],
    code: `#include <iostream>
#include <thread>
#include <mutex>

std::mutex lockA, lockB;

void thread1() {
    std::lock_guard<std::mutex> a(lockA);   // T1 holds A
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::lock_guard<std::mutex> b(lockB);   // T1 wants B
    std::cout << "T1 acquired both\\n";
}

void thread2() {
    std::lock_guard<std::mutex> b(lockB);   // T2 holds B
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::lock_guard<std::mutex> a(lockA);   // T2 wants A
    std::cout << "T2 acquired both\\n";
}

int main() {
    std::thread t1(thread1);
    std::thread t2(thread2);
    t1.join();
    t2.join();
    return 0;
}`,
    fixedCode: `#include <iostream>
#include <thread>
#include <mutex>

std::mutex lockA, lockB;

// Consistent global lock ordering: always A before B
void thread1() {
    std::lock_guard<std::mutex> a(lockA);
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::lock_guard<std::mutex> b(lockB);
    std::cout << "T1 acquired both\\n";
}

void thread2() {
    std::lock_guard<std::mutex> a(lockA);   // same order
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::lock_guard<std::mutex> b(lockB);
    std::cout << "T2 acquired both\\n";
}

int main() {
    std::thread t1(thread1);
    std::thread t2(thread2);
    t1.join();
    t2.join();
    return 0;
}`,
  },
  {
    id: 'producer-consumer',
    name: 'Producer-Consumer',
    category: 'Synchronization',
    description: 'A bounded buffer shared between a producer and a consumer using a mutex and condition variables.',
    hasFix: false,
    threadCount: 2,
    resourceCount: 2,
    tags: ['producer', 'consumer', 'condition variable'],
    code: `#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>

std::queue<int> buffer;
std::mutex mtx;
std::condition_variable cv;
const int MAX = 5;

void producer() {
    for (int i = 1; i <= 10; ++i) {
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock, [] { return buffer.size() < MAX; });
        buffer.push(i);
        std::cout << "Produced: " << i << "\\n";
        lock.unlock();
        cv.notify_one();
    }
}

void consumer() {
    for (int i = 1; i <= 10; ++i) {
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock, [] { return !buffer.empty(); });
        int val = buffer.front();
        buffer.pop();
        std::cout << "Consumed: " << val << "\\n";
        lock.unlock();
        cv.notify_one();
    }
}

int main() {
    std::thread p(producer);
    std::thread c(consumer);
    p.join();
    c.join();
    return 0;
}`,
  },
  {
    id: 'dining-philosophers',
    name: 'Dining Philosophers',
    category: 'Deadlock',
    description: 'Five philosophers share five forks. Each needs two forks to eat, risking deadlock.',
    hasFix: false,
    threadCount: 5,
    resourceCount: 5,
    tags: ['deadlock', 'dining philosophers', 'resource ordering'],
    code: `#include <iostream>
#include <thread>
#include <mutex>
#include <vector>

std::vector<std::mutex> forks(5);

void philosopher(int id) {
    int left = id;
    int right = (id + 1) % 5;

    // Pick up left fork first
    forks[left].lock();
    std::this_thread::sleep_for(
        std::chrono::milliseconds(5));
    // Then right fork
    forks[right].lock();

    std::cout << "Philosopher " << id << " eating\\n";
    forks[right].unlock();
    forks[left].unlock();
}

int main() {
    std::vector<std::thread> threads;
    for (int i = 0; i < 5; ++i)
        threads.emplace_back(philosopher, i);
    for (auto& t : threads) t.join();
    return 0;
}`,
  },
];

export function getExample(id: string): Example | undefined {
  return EXAMPLES.find((e) => e.id === id);
}
