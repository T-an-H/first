package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 分组（表名用 student_group，避免与 MySQL 保留字 group 冲突）
 */
@Data
@TableName(value = "student_group", autoResultMap = true)
public class StudentGroup {

    @TableId(type = IdType.INPUT)
    private String id;

    private String courseId;

    private String name;

    /** 成员学生ID列表，DB 中以 JSON 数组字符串存储 */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> memberIds;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
