package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Homework;
import com.course.backend.service.HomeworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 作业接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkService homeworkService;

    /**
     * GET /api/teaching/homeworks  作业列表
     * 可选参数：courseId
     */
    @GetMapping("/homeworks")
    public Result<List<Homework>> listHomeworks(@RequestParam(required = false) String courseId) {
        QueryWrapper<Homework> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        qw.orderByDesc("created_at");
        return Result.ok(homeworkService.list(qw));
    }

    /**
     * POST /api/teaching/homeworks  布置作业
     */
    @PostMapping("/homeworks")
    public Result<Homework> addHomework(@RequestBody Homework homework) {
        if (!StringUtils.hasText(homework.getId())) {
            homework.setId("hw-" + System.currentTimeMillis());
        }
        homeworkService.save(homework);
        return Result.ok(homework);
    }

    /**
     * PUT /api/teaching/homeworks/{id}  更新作业
     */
    @PutMapping("/homeworks/{id}")
    public Result<Homework> updateHomework(@PathVariable String id, @RequestBody Homework homework) {
        homework.setId(id);
        homeworkService.updateById(homework);
        return Result.ok(homeworkService.getById(id));
    }

    /**
     * DELETE /api/teaching/homeworks/{id}  删除作业
     */
    @DeleteMapping("/homeworks/{id}")
    public Result<Void> deleteHomework(@PathVariable String id) {
        homeworkService.removeById(id);
        return Result.ok();
    }
}
