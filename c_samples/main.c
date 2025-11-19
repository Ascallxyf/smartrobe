#include <stdio.h>

int main(void) {
    puts("Hello, C toolchain is working!\n");
    // 简单计算，验证编译优化与运行
    long long sum = 0;
    for (int i = 1; i <= 1000000; ++i) sum += i;
    printf("sum(1..1e6) = %lld\n", sum);
    return 0;
}
