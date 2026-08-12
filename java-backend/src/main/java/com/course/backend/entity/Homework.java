package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 作业
 */
@Data
@TableName("homework")
public class Homework {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String title;

    private String description;

    private LocalDateTime dueDate;

    /** 布置人（教师ID） */
    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
