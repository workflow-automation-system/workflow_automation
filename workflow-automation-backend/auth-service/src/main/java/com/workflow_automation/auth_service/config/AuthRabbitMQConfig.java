package com.workflow_automation.auth_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class AuthRabbitMQConfig {

    public static final String ORGANIZATION_EXCHANGE = "organization.exchange";
    public static final String AUDIT_EXCHANGE = "audit.exchange";

    public static final String DEPARTMENT_EVENTS_QUEUE = "auth.department.events.queue";

    @Bean
    public TopicExchange organizationExchange() {
        return new TopicExchange(ORGANIZATION_EXCHANGE);
    }

    @Bean
    public TopicExchange auditExchange() {
        return new TopicExchange(AUDIT_EXCHANGE);
    }

    @Bean
    public Queue departmentEventsQueue() {
        return new Queue(DEPARTMENT_EVENTS_QUEUE, true);
    }

    @Bean
    public Binding departmentEventsBinding(Queue departmentEventsQueue, TopicExchange organizationExchange) {
        return BindingBuilder.bind(departmentEventsQueue).to(organizationExchange).with("organization.department.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
