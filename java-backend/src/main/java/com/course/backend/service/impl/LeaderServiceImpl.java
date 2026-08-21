package com.course.backend.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.course.backend.entity.Leader;
import com.course.backend.mapper.LeaderMapper;
import com.course.backend.service.LeaderService;
import org.springframework.stereotype.Service;

@Service
public class LeaderServiceImpl extends ServiceImpl<LeaderMapper, Leader> implements LeaderService {
}
