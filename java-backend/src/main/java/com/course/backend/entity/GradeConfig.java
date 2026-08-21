package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 成绩权重配置（一门课程一条，course_id 为主键）
 */
@Data
@TableName("grade_config")
public class GradeConfig {

    @TableId(type = IdType.INPUT)
    private String courseId;

    private Integer regularWeight;

    private Integer midtermWeight;

    private Integer finalWeight;

    private Integer selfEvalWeight;

    private Integer peerReviewWeight;

    private Integer interGroupEvalWeight;

    private Integer teacherScoreWeight;

    private Integer mentorScoreWeight;

    private Integer midtermExamWeight;

    private Integer midtermProjectWeight;

    private Integer finalExamWeight;

    private Integer finalProjectWeight;

    private Integer qualityEvalMaxBonus;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /**
     * 返回默认配置（与前端 getDefaultGradeConfig 对齐）
     */
    public static GradeConfig defaultOf(String courseId) {
        GradeConfig cfg = new GradeConfig();
        cfg.setCourseId(courseId);
        cfg.setRegularWeight(40);
        cfg.setMidtermWeight(0);
        cfg.setFinalWeight(60);
        cfg.setSelfEvalWeight(10);
        cfg.setPeerReviewWeight(20);
        cfg.setInterGroupEvalWeight(10);
        cfg.setTeacherScoreWeight(30);
        cfg.setMentorScoreWeight(30);
        cfg.setMidtermExamWeight(50);
        cfg.setMidtermProjectWeight(50);
        cfg.setFinalExamWeight(50);
        cfg.setFinalProjectWeight(50);
        cfg.setQualityEvalMaxBonus(10);
        return cfg;
    }
}
