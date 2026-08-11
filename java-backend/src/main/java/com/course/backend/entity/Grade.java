package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 综合成绩
 */
@Data
@TableName("grade")
public class Grade {

    @TableId(type = IdType.INPUT)
    private String id;

    private String studentId;

    private String courseId;

    private BigDecimal score;

    private String semester;

    private String comment;

    /** 综合总成绩（可能不同于 score） */
    private BigDecimal totalScore;

    private LocalDateTime gradedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
