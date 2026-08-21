package com.course.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 课程管理平台后端启动类
 */
@SpringBootApplication
@MapperScan("com.course.backend.mapper")
public class CourseBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CourseBackendApplication.class, args);
        System.out.println("✅ course-backend 启动成功，端口 8080");
    }
}
