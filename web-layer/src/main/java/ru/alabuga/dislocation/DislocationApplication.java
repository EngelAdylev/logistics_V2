package ru.alabuga.dislocation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DislocationApplication {
    public static void main(String[] args) {
        SpringApplication.run(DislocationApplication.class, args);
    }
}
