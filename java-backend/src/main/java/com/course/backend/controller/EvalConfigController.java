package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.EvalConfig;
import com.course.backend.service.EvalConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 评价方案配置接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class EvalConfigController {

    private final EvalConfigService evalConfigService;

    /**
     * GET /api/teaching/eval-configs  评价配置列表
     * 可选参数：courseId
     */
    @GetMapping("/eval-configs")
    public Result<List<EvalConfig>> listConfigs(@RequestParam(required = false) String courseId) {
        QueryWrapper<EvalConfig> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        return Result.ok(evalConfigService.list(qw));
    }

    /**
     * GET /api/teaching/eval-config/{courseId}  按课程查评价配置（未配置返回 null）
     */
    @GetMapping("/eval-config/{courseId}")
    public Result<EvalConfig> getConfig(@PathVariable String courseId) {
        return Result.ok(evalConfigService.getById(courseId));
    }

    /**
     * POST /api/teaching/eval-configs  保存评价配置（已存在则更新，否则新增）
     */
    @PostMapping("/eval-configs")
    public Result<EvalConfig> saveConfig(@RequestBody EvalConfig config) {
        if (!StringUtils.hasText(config.getCourseId())) {
            return Result.fail(400, "courseId 不能为空");
        }
        if (!StringUtils.hasText(config.getTemplate())) config.setTemplate("all");
        // 评价频率固定为每两学时一次（次数由课程总学时自动计算），忽略传入频率
        config.setFrequency("biweekly");
        if (!StringUtils.hasText(config.getOverdueRule())) config.setOverdueRule("average");
        if (config.getHasMentor() == null) config.setHasMentor(false);
        evalConfigService.saveOrUpdate(config);
        return Result.ok(evalConfigService.getById(config.getCourseId()));
    }

    /**
     * DELETE /api/teaching/eval-configs/{courseId}  删除评价配置
     */
    @DeleteMapping("/eval-configs/{courseId}")
    public Result<Void> deleteConfig(@PathVariable String courseId) {
        evalConfigService.removeById(courseId);
        return Result.ok();
    }
}
