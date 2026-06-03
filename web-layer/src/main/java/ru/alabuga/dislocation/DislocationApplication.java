package ru.alabuga.dislocation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DislocationApplication {
    public static void main(String[] args) {
        SpringApplication.run(DislocationApplication.class, args);
    }
}
