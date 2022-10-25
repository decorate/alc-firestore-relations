/* eslint-disable */
import { AxiosInstance } from 'axios'
import mockServer from 'axios-mock-server'
import mock0 from './users'

export default (client?: AxiosInstance) => mockServer([
  {
    path: '/users',
    methods: mock0
  }
], client, '')
