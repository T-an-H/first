package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Todo;
import com.course.backend.service.TodoService;
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
 * 待办事项接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    /**
     * GET /api/teaching/todos  待办列表
     * 可选参数：createdBy / completed
     */
    @GetMapping("/todos")
    public Result<List<Todo>> listTodos(
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) Boolean completed) {
        QueryWrapper<Todo> qw = new QueryWrapper<>();
        if (StringUtils.hasText(createdBy)) qw.eq("created_by", createdBy);
        if (completed != null) qw.eq("completed", completed ? 1 : 0);
        qw.orderByDesc("created_at");
        return Result.ok(todoService.list(qw));
    }

    /**
     * POST /api/teaching/todos  新增待办
     * body: { id?, title, completed?, dueDate?, createdBy }
     */
    @PostMapping("/todos")
    public Result<Todo> addTodo(@RequestBody Todo todo) {
        if (!StringUtils.hasText(todo.getId())) {
            todo.setId("todo-" + System.currentTimeMillis());
        }
        if (todo.getCompleted() == null) todo.setCompleted(false);
        todoService.save(todo);
        return Result.ok(todo);
    }

    /**
     * PUT /api/teaching/todos/{id}  更新待办（标题/完成状态/截止时间）
     */
    @PutMapping("/todos/{id}")
    public Result<Todo> updateTodo(@PathVariable String id, @RequestBody Todo todo) {
        todo.setId(id);
        todoService.updateById(todo);
        return Result.ok(todoService.getById(id));
    }

    /**
     * DELETE /api/teaching/todos/{id}  删除待办
     */
    @DeleteMapping("/todos/{id}")
    public Result<Void> deleteTodo(@PathVariable String id) {
        todoService.removeById(id);
        return Result.ok();
    }
}
