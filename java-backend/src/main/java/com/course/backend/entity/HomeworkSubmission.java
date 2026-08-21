package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 作业提交
 */
@Data
@TableName("homework_submission")
public class HomeworkSubmission {

    @TableId(type = IdType.INPUT)
    private String id;

    private String homeworkId;

    private String courseId;

    private String studentId;

    private LocalDateTime submittedAt;

    private String fileName;

    private String fileDataUrl;

    private Long fileSize;

    private String fileType;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
