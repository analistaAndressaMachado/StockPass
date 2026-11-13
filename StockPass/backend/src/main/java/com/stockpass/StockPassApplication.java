package com.stockpass;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StockPassApplication {
    public static void main(String[] args) { SpringApplication.run(StockPassApplication.class, args); }
}
