package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.Mentor;
import com.course.backend.mapper.MentorMapper;
import com.course.backend.service.MentorService;
import org.springframework.stereotype.Service;

@Service
public class MentorServiceImpl extends ServiceImpl<MentorMapper, Mentor> implements MentorService {
}
