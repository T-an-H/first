package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 成绩明细（每个学生每门课一条）
 */
@Data
@TableName("detailed_grade")
public class DetailedGrade {

    @TableId(type = IdType.INPUT)
    private String id;

    private String studentId;

    private String courseId;

    private BigDecimal selfEvalScore;

    private BigDecimal peerReviewScore;

    private BigDecimal interGroupScore;

    private BigDecimal teacherScore;

    private BigDecimal mentorScore;

    private BigDecimal midtermExamScore;

    private BigDecimal midtermProjectScore;

    private BigDecimal finalExamScore;

    private BigDecimal finalProjectScore;

    private LocalDateTime gradedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
