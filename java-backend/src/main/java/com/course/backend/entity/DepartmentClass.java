package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 学院班级映射（基础数据）
 */
@Data
@TableName("department_class")
public class DepartmentClass {

    @TableId(type = IdType.INPUT)
    private String id;

    private String departmentId;

    private String className;

    private LocalDateTime createdAt;
}
