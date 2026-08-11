package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 课程
 */
@Data
@TableName("course")
public class Course {

    @TableId(type = IdType.INPUT)
    private String id;

    private String title;

    private String description;

    private String categoryId;

    private String departmentId;

    private String cover;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer credits;

    private Integer duration;

    /** active / inactive / draft */
    private String status;

    /** 授课教师 */
    private String teacher;

    /** 企业导师 */
    private String mentor;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
