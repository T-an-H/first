package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 排课
 */
@Data
@TableName("schedule")
public class Schedule {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String title;

    /** 周几（周一~周日） */
    private String day;

    /** 上课班级 */
    private String className;

    private LocalDate startDate;

    private LocalDate endDate;

    /** 时间段，如 8:00-9:40 */
    private String timeSlot;

    /** 教室 */
    private String room;

    /** 授课教师 */
    private String teacher;

    /** 企业导师 */
    private String mentor;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
