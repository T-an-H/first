package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.Todo;
import com.course.backend.mapper.TodoMapper;
import com.course.backend.service.TodoService;
import org.springframework.stereotype.Service;

@Service
public class TodoServiceImpl extends ServiceImpl<TodoMapper, Todo> implements TodoService {
}
