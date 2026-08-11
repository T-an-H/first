package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 学生
 */
@Data
@TableName("student")
public class Student {

    @TableId(type = IdType.INPUT)
    private String id;

    private String name;

    /** 学号 */
    private String studentId;

    /** 班级 */
    private String className;

    private String phone;

    private String email;

    private String avatar;

    private LocalDate joinDate;

    /** active / inactive */
    private String status;

    /** 高考/入学成绩（用于分层判定） */
    private Integer enrollmentScore;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
