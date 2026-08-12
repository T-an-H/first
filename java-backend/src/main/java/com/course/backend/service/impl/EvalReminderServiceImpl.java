package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.EvalReminder;
import com.course.backend.mapper.EvalReminderMapper;
import com.course.backend.service.EvalReminderService;
import org.springframework.stereotype.Service;

@Service
public class EvalReminderServiceImpl extends ServiceImpl<EvalReminderMapper, EvalReminder> implements EvalReminderService {
}
