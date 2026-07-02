package com.workflow_automation.organization_service.config;

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
public class OrganizationRabbitMQConfig {

    public static final String ORGANIZATION_EXCHANGE = "organization.exchange";
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";

    public static final String MEMBER_EVENTS_QUEUE = "organization.member.events.queue";

    @Bean
    public TopicExchange organizationExchange() {
        return new TopicExchange(ORGANIZATION_EXCHANGE);
    }

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE);
    }

    @Bean
    public Queue memberEventsQueue() {
        return new Queue(MEMBER_EVENTS_QUEUE, true);
    }

    @Bean
    public Binding memberEventsBinding(Queue memberEventsQueue, TopicExchange organizationExchange) {
        return BindingBuilder.bind(memberEventsQueue).to(organizationExchange).with("organization.member.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
