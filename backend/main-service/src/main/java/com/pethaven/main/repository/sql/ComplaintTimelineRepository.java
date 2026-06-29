package com.pethaven.main.repository.sql;

import com.pethaven.main.model.sql.ComplaintTimeline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintTimelineRepository extends JpaRepository<ComplaintTimeline, Long> {
}
