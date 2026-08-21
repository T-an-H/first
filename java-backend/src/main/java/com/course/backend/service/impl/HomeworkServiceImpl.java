package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.Homework;
import com.course.backend.mapper.HomeworkMapper;
import com.course.backend.service.HomeworkService;
import org.springframework.stereotype.Service;

@Service
public class HomeworkServiceImpl extends ServiceImpl<HomeworkMapper, Homework> implements HomeworkService {
}
