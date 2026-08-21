package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * AI 分层记录（一门课程一名学生一条）
 */
@Data
@TableName("student_tier")
public class StudentTier {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String studentId;

    /** basic / advanced / excellent */
    private String tier;

    /** 测试得分 */
    private Integer score;

    /** 分层时间（兼容前端日期字符串） */
    private String createdAt;
}
