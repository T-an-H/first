package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 学院（基础数据）
 */
@Data
@TableName("department")
public class Department {

    @TableId(type = IdType.INPUT)
    private String id;

    private String name;

    private String color;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
