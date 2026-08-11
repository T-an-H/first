package com.course.backend.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评价方案配置（每门课程一条，course_id 为主键）
 */
@Data
@TableName("eval_config")
public class EvalConfig {

    @TableId(type = IdType.INPUT)
    private String courseId;

    /** all / standard / simple / project */
    private String template;

    /** biweekly / per_unit / project_milestone / custom */
    private String frequency;

    /** 自定义评价次数（仅 frequency=custom 时有效） */
    private Integer customSessions;

    /** 是否有企业导师参与 */
    private Boolean hasMentor;

    /** average / none / zero / full */
    private String overdueRule;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
