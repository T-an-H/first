package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 课程分类（基础数据）
 */
@Data
@TableName("category")
public class Category {

    @TableId(type = IdType.INPUT)
    private String id;

    private String name;

    private String color;

    /** 课程数（展示用） */
    private Integer courseCount;

    private String departmentId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
